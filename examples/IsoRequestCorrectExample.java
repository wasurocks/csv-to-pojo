@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(name = "KbnThirdPartyFundTransferRequestV1IsoRequest", description = "ISO Request")
public class IsoRequest {
    @Schema(description = "Mandatory. Transaction amount in THB . Must be greater than 0.", example = "10.00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "must not be null")
    @Positive(message = "must be greater than 0")
    @JsonProperty("amount")
    private BigDecimal amount;

    @Schema(description = "Optional. Unique end-to-end transaction identifier. Must be UUID format.", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @Size(max = 36, message = "length must not exceed 36 characters")
    @JsonProperty("endToEndId")
    private String endToEndId;

    @Schema(description = "Mandatory. Transaction category purpose code (e.g., ' RFT '). Must be a valid BOT category.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "must not be null or empty")
    @Size(max = 4, message = "length must not exceed 4 characters")
    @JsonProperty("categoryPurpose")
    private String categoryPurpose;

    @Schema(description = "Mandatory. Unique reference number assigned for the transaction. Copy as text Bahtnet Reference Number Mandatory for CMS, ALS(SM), PMH Pattern : BBBBTSSSSS BBBB: Branch No(0700) T : From Application 0 = CMS 7 = ALS-SM(PN) 8 = PMH SSSSS : Sequence No. Set value as " 0700 8 " + 5 digits running number starting from 1 generate from sequence named bahtnet_transaction_seq .", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "must not be null or empty")
    @Size(max = 10, message = "length must not exceed 10 characters")
    @JsonProperty("referenceNo")
    private String referenceNo;

    @Schema(description = "Mandatory. Transaction message type. Valid values: '008'", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "must not be null or empty")
    @Size(max = 3, message = "length must not exceed 3 characters")
    @JsonProperty("messageType")
    private String messageType;

    @Schema(description = "Mandatory. Transaction date in YYYY-MM-DD format. Must be a valid date.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "must not be null or empty")
    @Pattern(
            regexp = "^\\d{4}-\\d{2}-\\d{2}$",
            message = "Date must be in the format yyyy-MM-dd"
    )
    @JsonProperty("date")
    private String date;

    @Schema(description = "Optional. Description (วัตถุประสงค์การโอนเงิน)", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @Size(max = 140, message = "length must not exceed 140 characters")
    @JsonProperty("instructionForCdtrAgent")
    private String instructionForCdtrAgent;

    @Valid
    @NotNull
    @Schema(description = "Mandatory. Creditor", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("cdtr")
    private Creditor cdtr;

    @Valid
    @NotNull
    @Schema(description = "Mandatory. Debtor", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("dbtr")
    private Debtor dbtr;
}
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(name = "IsoRequest", description = "")
public class IsoRequest {
    @Schema(description = "Transaction amount in THB . Must be greater than 0.", required = true)
    @JsonProperty("amount")
    private Double amount;
    
    @Schema(description = "Unique end-to-end transaction identifier. Must be UUID format.")
    @JsonProperty("endToEndId")
    private String endToEndId;
    
    @Schema(description = "Transaction category purpose code (e.g., ' RFT '). Must be a valid BOT category.", required = true)
    @JsonProperty("categoryPurpose")
    private String categoryPurpose;
    
    @Schema(description = "Unique reference number assigned for the transaction. Copy as text Bahtnet Reference Number Mandatory for CMS, ALS(SM), PMH Pattern : BBBBTSSSSS BBBB: Branch No(0700) T : From Application 0 = CMS 7 = ALS-SM(PN) 8 = PMH SSSSS : Sequence No", required = true)
    @JsonProperty("referenceNo")
    private String referenceNo;
    
    @Schema(description = "Transaction message type. Valid values: '008'", required = true)
    @JsonProperty("messageType")
    private String messageType;
    
    @Schema(description = "Transaction date in YYYY-MM-DD format. Must be a valid date.", required = true)
    @JsonProperty("date")
    private LocalDate date;
    
    @Schema(description = "Description (วัตถุประสงค์การโอนเงิน)")
    @JsonProperty("instructionForCdtrAgent")
    private String instructionForCdtrAgent;
    
    @Schema(description = "", required = true)
    @JsonProperty("cdtr")
    private IsoRequestCdtr cdtr;
    
    @Schema(description = "", required = true)
    @JsonProperty("dbtr")
    private IsoRequestDbtr dbtr;
    
}
